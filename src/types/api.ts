export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  code: number;
  data: T | null;
};
