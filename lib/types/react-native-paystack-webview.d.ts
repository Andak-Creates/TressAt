declare module "react-native-paystack-webview" {
  import React from "react";
  import { ViewStyle } from "react-native";

  interface PaystackWebViewProps {
    paystackKey: string;
    amount: number;
    billingEmail: string;
    activityIndicatorColor?: string;
    onSuccess?: (response: any) => void;
    onCancel?: (response: any) => void;
    autoStart?: boolean;
    style?: ViewStyle;
  }

  export default class PaystackWebView extends React.Component<PaystackWebViewProps> {}
}
