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

package validation_test

import (
	"testing"

	phpav1alpha1 "github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/api/v1alpha1"
	"github.com/gagansingh0805/predictive-horizontal-pod-autoscaler/internal/validation"
	autoscalingv2 "k8s.io/api/autoscaling/v2"
)

func int32Ptr(i int32) *int32 {
	return &i
}

func TestValidate_LSTM(t *testing.T) {
	tests := []struct {
		name        string
		instance    *phpav1alpha1.PredictiveHorizontalPodAutoscaler
		expectError bool
	}{
		{
			name: "Valid LSTM model",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(1),
					MaxReplicas: 10,
					Models: []phpav1alpha1.Model{
						{
							Type: phpav1alpha1.TypeLSTM,
							Name: "lstm-test",
							LSTM: &phpav1alpha1.LSTM{
								HistorySize: 10,
								LookAhead:   45000,
							},
						},
					},
				},
			},
			expectError: false,
		},
		{
			name: "Invalid LSTM nil config",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(1),
					MaxReplicas: 10,
					Models: []phpav1alpha1.Model{
						{
							Type: phpav1alpha1.TypeLSTM,
							Name: "lstm-nil",
						},
					},
				},
			},
			expectError: true,
		},
		{
			name: "Invalid LSTM historySize too small",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(1),
					MaxReplicas: 10,
					Models: []phpav1alpha1.Model{
						{
							Type: phpav1alpha1.TypeLSTM,
							Name: "lstm-small-history",
							LSTM: &phpav1alpha1.LSTM{
								HistorySize: 1,
								LookAhead:   45000,
							},
						},
					},
				},
			},
			expectError: true,
		},
		{
			name: "Invalid LSTM lookAhead zero",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(1),
					MaxReplicas: 10,
					Models: []phpav1alpha1.Model{
						{
							Type: phpav1alpha1.TypeLSTM,
							Name: "lstm-zero-lookahead",
							LSTM: &phpav1alpha1.LSTM{
								HistorySize: 10,
								LookAhead:   0,
							},
						},
					},
				},
			},
			expectError: true,
		},
		{
			name: "Invalid MinReplicas greater than MaxReplicas",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(15),
					MaxReplicas: 10,
					Models:      []phpav1alpha1.Model{},
				},
			},
			expectError: true,
		},
		{
			name: "Invalid MinReplicas zero without object or external metric",
			instance: &phpav1alpha1.PredictiveHorizontalPodAutoscaler{
				Spec: phpav1alpha1.PredictiveHorizontalPodAutoscalerSpec{
					MinReplicas: int32Ptr(0),
					MaxReplicas: 10,
					Metrics: []autoscalingv2.MetricSpec{
						{
							Type: autoscalingv2.ResourceMetricSourceType,
						},
					},
					Models: []phpav1alpha1.Model{},
				},
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.Validate(tt.instance)
			if (err != nil) != tt.expectError {
				t.Errorf("Validate() error = %v, expectError %v", err, tt.expectError)
			}
		})
	}
}
