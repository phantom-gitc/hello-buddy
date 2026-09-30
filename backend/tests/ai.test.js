const promptService = require('../src/services/ai/prompt.service');
const groqProvider = require('../src/services/ai/providers/groq.provider');
const geminiProvider = require('../src/services/ai/providers/gemini.provider');

describe('🤖 AI & Prompts', () => {
  test('🎓 Teacher prompt builder', () => {
    const prompt = promptService.getTeacherSystemPrompt({
      domain: 'Backend & Systems',
      role: 'Node.js Architect',
      topic: 'Event Loop & Libuv',
      difficulty: 'expert',
      userProfile: { name: 'Alex' },
    });

    expect(prompt).toContain('Event Loop & Libuv');
    expect(prompt).toContain('Node.js Architect');
    expect(prompt).toContain('Alex');
  });

  test('📝 Interview evaluation schema', () => {
    const { system, user } = promptService.getInterviewAnswerEvaluationPrompt({
      question: 'How does indexing work in MongoDB?',
      answer: 'It uses B-trees to avoid full collection scans.',
      role: 'Backend Engineer',
      difficulty: 'intermediate',
    });

    expect(system).toContain('technicalAccuracy');
    expect(system).toContain('idealAnswer');
    expect(user).toContain('How does indexing work in MongoDB?');
  });

  test('⚡ Groq fallback mock', async () => {
    const spy = jest.spyOn(groqProvider, 'isAvailable').mockReturnValue(false);
    const result = await groqProvider.generateText({
      messages: [{ role: 'user', content: 'Explain Redis caching' }],
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Mock AI Response');
    spy.mockRestore();
  });

  test('♊ Gemini fallback mock', async () => {
    const spy = jest.spyOn(geminiProvider, 'isAvailable').mockReturnValue(false);
    const result = await geminiProvider.generateText({
      messages: [{ role: 'user', content: 'Explain MongoDB indexing' }],
    });

    expect(typeof result).toBe('string');
    expect(result).toContain('Mock Gemini Response');
    spy.mockRestore();
  });
});
