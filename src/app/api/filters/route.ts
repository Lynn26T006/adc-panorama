import { NextResponse } from "next/server";
import {
  getProductStages,
  getProductTargets,
  getProductIndications,
  getConjugationMethods,
  getPayloadClasses,
  getLinkerTypes,
} from "@/lib/data";

let cached: any = null;

export async function GET() {
  if (!cached) {
    cached = {
      stages: getProductStages(),
      targets: getProductTargets(),
      indications: getProductIndications(),
      conjugationMethods: getConjugationMethods(),
      payloadClasses: getPayloadClasses(),
      linkerTypes: getLinkerTypes(),
    };
  }
  return NextResponse.json(cached);
}
