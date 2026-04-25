# Custom Toast, Alert & Confirm UI Components

## Overview

Vibe Drama uses custom Toast, Alert, and Confirm components with beautiful animations and Vibe tone styling. These replace native browser `alert()` and `confirm()` dialogs.

## Toast Notifications

### Usage

```typescript
import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success("Success!", "Your action completed successfully.");
  };

  const handleError = () => {
    toast.error("Error!", "Something went wrong.");
  };

  const handleInfo = () => {
    toast.info("Info", "This is an informational message.");
  };

  const handleWarning = () => {
    toast.warning("Warning", "Please be careful.");
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleInfo}>Show Info</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}
```

### API

```typescript
toast.success(title: string, message?: string, duration?: number);
toast.error(title: string, message?: string, duration?: number);
toast.info(title: string, message?: string, duration?: number);
toast.warning(title: string, message?: string, duration?: number);
```

- **title**: Bold heading text
- **message**: Optional description text
- **duration**: Auto-dismiss duration in ms (default: 4000)

## Alert Dialogs

### Usage

```typescript
import { useAlert } from "@/hooks/useAlert";

function MyComponent() {
  const { showAlert } = useAlert();

  const handleShowAlert = () => {
    showAlert({
      type: "success",
      title: "Success!",
      message: "Your changes have been saved.",
      confirmText: "OK",
      onConfirm: () => {
        console.log("User clicked OK");
      },
    });
  };

  return <button onClick={handleShowAlert}>Show Alert</button>;
}
```

### API

```typescript
showAlert({
  type: "success" | "error" | "info" | "warning",
  title: string,
  message?: string,
  confirmText?: string, // Default: "OK"
  onConfirm?: () => void,
});
```

## Confirm Dialogs

### Usage

```typescript
import { useAlert } from "@/hooks/useAlert";

function MyComponent() {
  const { showConfirm } = useAlert();

  const handleDelete = () => {
    showConfirm({
      title: "Delete Item?",
      message: "This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        console.log("User confirmed deletion");
        // Perform delete action
      },
      onCancel: () => {
        console.log("User cancelled");
      },
    });
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### API

```typescript
showConfirm({
  title: string,
  message?: string,
  variant?: "danger" | "warning" | "primary", // Default: "danger"
  confirmText?: string, // Default: "Xác nhận"
  cancelText?: string, // Default: "Hủy"
  onConfirm: () => void,
  onCancel?: () => void,
});
```

## Migration Guide

### Before (Native Browser)

```typescript
// ❌ Old way
alert("Success!");
if (confirm("Are you sure?")) {
  performAction();
}
```

### After (Custom UI)

```typescript
// ✅ New way
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

const toast = useToast();
const { showConfirm } = useAlert();

toast.success("Success!", "Your action completed.");

showConfirm({
  title: "Are you sure?",
  onConfirm: () => {
    performAction();
  },
});
```

## Styling

All components use:
- Vibe tone color palette (vibe-pink, gradients)
- Framer Motion animations
- Backdrop blur effects
- Native app feel with smooth transitions
- Dark theme optimized

## Examples

### Replace all `alert()` calls

```typescript
// Find and replace pattern:
// alert("message") -> toast.info("message")
// alert("Error: " + error) -> toast.error("Error", error)
```

### Replace all `confirm()` calls

```typescript
// Find and replace pattern:
if (confirm("Delete?")) { 
  deleteItem(); 
}

// Becomes:
showConfirm({
  title: "Delete?",
  variant: "danger",
  onConfirm: () => deleteItem(),
});
```

## Component Locations

- **Toast**: `/src/components/ui/Toast.tsx`
- **ToastContainer**: `/src/components/ui/ToastContainer.tsx`
- **Alert**: `/src/components/ui/Alert.tsx`
- **Confirm**: `/src/components/ui/Confirm.tsx`
- **NotificationProvider**: `/src/components/ui/NotificationProvider.tsx`
- **useToast Hook**: `/src/hooks/useToast.ts`
- **useAlert Hook**: `/src/hooks/useAlert.ts`
