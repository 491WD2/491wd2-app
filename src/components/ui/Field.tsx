import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/utils";
import {
  SMARTHR_INPUT,
  SMARTHR_SELECT,
  SMARTHR_TEXTAREA,
} from "../../lib/smarthrUi";

/** Light-shell form controls — readable on pastel / white cards. */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(SMARTHR_INPUT, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(SMARTHR_SELECT, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(SMARTHR_TEXTAREA, className)} {...props} />;
}
