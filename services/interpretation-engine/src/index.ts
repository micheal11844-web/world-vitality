export type {
  InterpretationProvider,
  InterpretationRequest,
  InterpretationResult,
  ConfidenceLevel,
  ContributingFactor,
} from "./InterpretationProvider.js";
export {
  SoilMoistureStatusProvider,
  CAPABILITY_ID as SOIL_MOISTURE_CAPABILITY_ID,
} from "./providers/soil-moisture-status-provider.js";
export {
  WeatherStatusProvider,
  CAPABILITY_ID as WEATHER_TEMPERATURE_CAPABILITY_ID,
} from "./providers/weather-status-provider.js";
