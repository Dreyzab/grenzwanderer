export interface QRScannerProps {
  onSuccess: (code: string) => void;
  onCancel?: () => void;
  onScan?: (code: string) => void;
} 