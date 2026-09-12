# Simple LSTM Example

This example demonstrates how to configure a **Predictive Horizontal Pod Autoscaler (PHPA)** with a **2-Layer Stacked LSTM** prediction model.

The LSTM model evaluates historical replica counts and projects future demand with non-linear surge curvature preemption (e.g. 45 seconds ahead).

## Quickstart

1. Deploy the test application:
   ```bash
   kubectl apply -f deployment.yaml
   ```

2. Deploy the PHPA custom resource:
   ```bash
   kubectl apply -f phpa.yaml
   ```

3. Watch the PHPA status:
   ```bash
   kubectl get phpa simple-lstm -w
   ```

