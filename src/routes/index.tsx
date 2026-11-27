import { createFileRoute } from "@tanstack/react-router";
import { Portfolio } from "@/components/dryer/Portfolio";

export const Route = createFileRoute("/")({ component: Portfolio });
