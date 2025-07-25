# Alert Component Enhancement Prompt

## Context

The Alert component is used to display notification messages to users with different types (success, error, information, etc.). The component needs to be enhanced with additional customization options.

## Current Features

- Displays alert messages with different types (info, success, warning, danger)
- Auto-creates container if not present
- Basic close button functionality

## Required Enhancements

### 1. Add AlertOptions Interface

Add a new interface to support customization options:

```typescript
export interface AlertOptions {
  containerId: string; // ID of the container where the alert will be displayed
  duration?: number; // Display duration in milliseconds (optional)
  dismissible?: boolean; // Allow user to close the alert (optional)
}
```

### 2. Implement New Features

1. Container ID Configuration

   - Allow custom container ID through options
   - Default to 'alert-container' if not provided

2. Auto-dismiss Feature

   - Add duration option for auto-dismissing alerts
   - Implement timer logic for auto-dismissal

3. Dismissible Option
   - Make close button optional through dismissible flag
   - Default to false if not specified

### 3. Implementation Details

1. Constructor Update

```typescript
constructor(message: string, type: AlertStatus = this.DEFAULT_TYPE, options?: AlertOptions)
```

2. Add setUpOptions Method

```typescript
private setUpOptions(options?: AlertOptions): void
// Handle default values and options configuration
```

3. Rename Methods

- Rename 'hide' to 'dismiss' for better clarity

### 4. Example Usage

```typescript
// Basic usage (unchanged)
new Alert('Operation completed successfully');

// With options
new Alert('Custom alert', 'success', {
  containerId: 'custom-container',
  duration: 5000,
  dismissible: true,
});
```

## Implementation Steps

1. Add AlertOptions interface
2. Implement setUpOptions method in Alert class
3. Update constructor to accept options
4. Modify init method to call setUpOptions first
5. Implement auto-dismiss functionality
6. Make close button conditional based on dismissible option
7. Rename hide method to dismiss
8. Update all existing usages of the Alert component

## File to Modify

- Source file: `public/ts/components/Alert.ts`
