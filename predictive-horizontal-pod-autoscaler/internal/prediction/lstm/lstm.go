/*
Copyright 2026 The Predictive Horizontal Pod Autoscaler Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package lstm

import (
	"encoding/json"
	"errors"
	"sort"
	"strconv"

	phpav1alpha1 "github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/api/v1alpha1"
)

const (
	defaultTimeout = 30000
)

const algorithmPath = "algorithms/lstm/lstm.py"

type lstmParameters struct {
	LookAhead      int                                 `json:"lookAhead"`
	ModelPath      *string                             `json:"modelPath,omitempty"`
	ReplicaHistory []phpav1alpha1.TimestampedReplicas `json:"replicaHistory"`
}

// AlgorithmRunner defines an algorithm runner, allowing algorithms to be run
type AlgorithmRunner interface {
	RunAlgorithmWithValue(algorithmPath string, value string, timeout int) (string, error)
}

// Predict provides logic for using a 2-Layer Stacked LSTM to make a prediction
type Predict struct {
	Runner AlgorithmRunner
}

// GetPrediction uses an LSTM neural network to predict what the replica count should be based on historical evaluations
func (p *Predict) GetPrediction(model *phpav1alpha1.Model, replicaHistory []phpav1alpha1.TimestampedReplicas) (int32, error) {
	if model.LSTM == nil {
		return 0, errors.New("no LSTM configuration provided for model")
	}

	if len(replicaHistory) == 0 {
		return 0, errors.New("no evaluations provided for LSTM model")
	}

	if len(replicaHistory) == 1 {
		// If only 1 evaluation is provided do not try and calculate using the LSTM model, just return
		// the target replicas from the only evaluation
		return replicaHistory[0].Replicas, nil
	}

	parameters, err := json.Marshal(lstmParameters{
		LookAhead:      model.LSTM.LookAhead,
		ModelPath:      model.LSTM.ModelPath,
		ReplicaHistory: replicaHistory,
	})
	if err != nil {
		return 0, err
	}

	timeout := defaultTimeout
	if model.CalculationTimeout != nil {
		timeout = *model.CalculationTimeout
	}

	value, err := p.Runner.RunAlgorithmWithValue(algorithmPath, string(parameters), timeout)
	if err != nil {
		return 0, err
	}

	prediction, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}

	return int32(prediction), nil
}

// PruneHistory keeps only the most recent evaluations up to HistorySize
func (p *Predict) PruneHistory(model *phpav1alpha1.Model, replicaHistory []phpav1alpha1.TimestampedReplicas) ([]phpav1alpha1.TimestampedReplicas, error) {
	if model.LSTM == nil {
		return nil, errors.New("no LSTM configuration provided for model")
	}

	if len(replicaHistory) < model.LSTM.HistorySize {
		return replicaHistory, nil
	}

	// Sort by date created, newest first
	sort.Slice(replicaHistory, func(i, j int) bool {
		return !replicaHistory[i].Time.Before(replicaHistory[j].Time)
	})

	// Remove oldest to fit into requirements, have to loop from the end to allow deletion without affecting indices
	for i := len(replicaHistory) - 1; i >= model.LSTM.HistorySize; i-- {
		replicaHistory = append(replicaHistory[:i], replicaHistory[i+1:]...)
	}

	return replicaHistory, nil
}

// GetType returns the type of the Prediction model
func (p *Predict) GetType() string {
	return phpav1alpha1.TypeLSTM
}

