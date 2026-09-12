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

package lstm_test

import (
	"errors"
	"testing"
	"time"

	phpav1alpha1 "github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/api/v1alpha1"
	"github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/internal/fake"
	"github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/internal/prediction/lstm"
	"github.com/google/go-cmp/cmp"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func intPtr(i int) *int {
	return &i
}

func TestPredict_GetPrediction(t *testing.T) {
	equateErrorMessage := cmp.Comparer(func(x, y error) bool {
		if x == nil || y == nil {
			return x == nil && y == nil
		}
		return x.Error() == y.Error()
	})

	var tests = []struct {
		description    string
		expected       int32
		expectedErr    error
		predicter      *lstm.Predict
		model          *phpav1alpha1.Model
		replicaHistory []phpav1alpha1.TimestampedReplicas
	}{
		{
			description:    "Fail no LSTM configuration",
			expected:       0,
			expectedErr:    errors.New("no LSTM configuration provided for model"),
			predicter:      &lstm.Predict{},
			model:          &phpav1alpha1.Model{},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{},
		},
		{
			description: "Fail no evaluations",
			expected:    0,
			expectedErr: errors.New("no evaluations provided for LSTM model"),
			predicter:   &lstm.Predict{},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{},
		},
		{
			description: "Success, only one evaluation, return without the prediction",
			expected:    15,
			expectedErr: nil,
			predicter:   &lstm.Predict{},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Replicas: 15,
				},
			},
		},
		{
			description: "Fail execution of algorithm fails",
			expected:    0,
			expectedErr: errors.New("algorithm fail"),
			predicter: &lstm.Predict{
				Runner: &fake.Run{
					RunAlgorithmWithValueReactor: func(algorithmPath, value string, timeout int) (string, error) {
						return "", errors.New("algorithm fail")
					},
				},
			},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Replicas: 4,
				},
				{
					Replicas: 6,
				},
			},
		},
		{
			description: "Fail algorithm returns non-integer castable value",
			expected:    0,
			expectedErr: errors.New(`strconv.Atoi: parsing "invalid": invalid syntax`),
			predicter: &lstm.Predict{
				Runner: &fake.Run{
					RunAlgorithmWithValueReactor: func(algorithmPath, value string, timeout int) (string, error) {
						return "invalid", nil
					},
				},
			},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Replicas: 4,
				},
				{
					Replicas: 6,
				},
			},
		},
		{
			description: "Success with custom calculation timeout",
			expected:    22,
			expectedErr: nil,
			predicter: &lstm.Predict{
				Runner: &fake.Run{
					RunAlgorithmWithValueReactor: func(algorithmPath, value string, timeout int) (string, error) {
						if timeout != 15000 {
							return "", errors.New("timeout did not match expected")
						}
						return "22", nil
					},
				},
			},
			model: &phpav1alpha1.Model{
				Type:               phpav1alpha1.TypeLSTM,
				CalculationTimeout: intPtr(15000),
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Replicas: 4,
				},
				{
					Replicas: 8,
				},
			},
		},
		{
			description: "Success default timeout",
			expected:    25,
			expectedErr: nil,
			predicter: &lstm.Predict{
				Runner: &fake.Run{
					RunAlgorithmWithValueReactor: func(algorithmPath, value string, timeout int) (string, error) {
						if timeout != 30000 {
							return "", errors.New("timeout did not match expected")
						}
						return "25", nil
					},
				},
			},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 10,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Replicas: 4,
				},
				{
					Replicas: 8,
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.description, func(t *testing.T) {
			result, err := test.predicter.GetPrediction(test.model, test.replicaHistory)
			if !cmp.Equal(&err, &test.expectedErr, equateErrorMessage) {
				t.Errorf("error mismatch (-want +got):\n%s", cmp.Diff(test.expectedErr, err, equateErrorMessage))
				return
			}
			if !cmp.Equal(test.expected, result) {
				t.Errorf("result mismatch (-want +got):\n%s", cmp.Diff(test.expected, result))
			}
		})
	}
}

func TestPredict_PruneHistory(t *testing.T) {
	equateErrorMessage := cmp.Comparer(func(x, y error) bool {
		if x == nil || y == nil {
			return x == nil && y == nil
		}
		return x.Error() == y.Error()
	})

	now := time.Now()

	var tests = []struct {
		description    string
		expected       []phpav1alpha1.TimestampedReplicas
		expectedErr    error
		predicter      *lstm.Predict
		model          *phpav1alpha1.Model
		replicaHistory []phpav1alpha1.TimestampedReplicas
	}{
		{
			description:    "Fail no LSTM configuration",
			expected:       nil,
			expectedErr:    errors.New("no LSTM configuration provided for model"),
			predicter:      &lstm.Predict{},
			model:          &phpav1alpha1.Model{},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{},
		},
		{
			description: "Success evaluations less than history size, do not prune",
			expected: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-5) * time.Minute)},
					Replicas: 1,
				},
			},
			expectedErr: nil,
			predicter:   &lstm.Predict{},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 3,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-5) * time.Minute)},
					Replicas: 1,
				},
			},
		},
		{
			description: "Success evaluations equal to history size, do not prune",
			expected: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-4) * time.Minute)},
					Replicas: 2,
				},
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-5) * time.Minute)},
					Replicas: 1,
				},
			},
			expectedErr: nil,
			predicter:   &lstm.Predict{},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 2,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-5) * time.Minute)},
					Replicas: 1,
				},
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-4) * time.Minute)},
					Replicas: 2,
				},
			},
		},
		{
			description: "Success evaluations greater than history size, prune oldest",
			expected: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-1) * time.Minute)},
					Replicas: 5,
				},
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-2) * time.Minute)},
					Replicas: 4,
				},
			},
			expectedErr: nil,
			predicter:   &lstm.Predict{},
			model: &phpav1alpha1.Model{
				Type: phpav1alpha1.TypeLSTM,
				LSTM: &phpav1alpha1.LSTM{
					HistorySize: 2,
					LookAhead:   45000,
				},
			},
			replicaHistory: []phpav1alpha1.TimestampedReplicas{
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-5) * time.Minute)},
					Replicas: 1,
				},
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-1) * time.Minute)},
					Replicas: 5,
				},
				{
					Time:     &metav1.Time{Time: now.Add(time.Duration(-2) * time.Minute)},
					Replicas: 4,
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.description, func(t *testing.T) {
			result, err := test.predicter.PruneHistory(test.model, test.replicaHistory)
			if !cmp.Equal(&err, &test.expectedErr, equateErrorMessage) {
				t.Errorf("error mismatch (-want +got):\n%s", cmp.Diff(test.expectedErr, err, equateErrorMessage))
				return
			}
			if !cmp.Equal(test.expected, result) {
				t.Errorf("result mismatch (-want +got):\n%s", cmp.Diff(test.expected, result))
			}
		})
	}
}

func TestPredict_GetType(t *testing.T) {
	predicter := &lstm.Predict{}
	expected := phpav1alpha1.TypeLSTM
	result := predicter.GetType()
	if result != expected {
		t.Errorf("type mismatch: want %s, got %s", expected, result)
	}
}
