# AI Architecture & Structured Output Guidelines

## 1. Multi-Provider Strategy

AI providers are abstracted behind a unified interface:

```text
[ Controller / Module ]
          ↓
[ AIService (Central Facade) ]
          ↓
[ Provider Interface (Groq | OpenAI | xAI) ]
```

The application switches providers seamlessly via `DEFAULT_AI_PROVIDER` or runtime fallback if an API is unavailable.

## 2. Structured JSON Enforcing

Whenever the application requires structured output (such as interview evaluations, reports, resume analysis):
1. System prompt specifies an exact JSON schema.
2. Low temperature (`0.2`) ensures precision.
3. The response is cleaned of any markdown artifacts and parsed.
4. The output is clamped and validated by the `EvaluationEngine` before persistence.
