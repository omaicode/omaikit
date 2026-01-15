export interface TestPattern {
  name: string;
  description: string;
  example: string;
  type: 'unit' | 'integration' | 'edge';
}

export class TestPatterns {
  getPatterns(language: string, framework: string): TestPattern[] {
    const normalized = language.toLowerCase();
    const fw = framework.toLowerCase();

    if (normalized === 'python') {
      return [
        {
          name: 'unit-test',
          description: 'Basic unit test with pytest-style assertions',
          example: 'def test_adds_numbers():\n    assert add(1, 2) == 3',
          type: 'unit',
        },
        {
          name: 'integration-test',
          description: 'Integration test with fixture setup',
          example:
            'def test_api_returns_200(client):\n    response = client.get("/health")\n    assert response.status_code == 200',
          type: 'integration',
        },
        {
          name: 'edge-case',
          description: 'Edge case for invalid inputs',
          example:
            'def test_rejects_empty_payload():\n    with pytest.raises(ValueError):\n        create_user({})',
          type: 'edge',
        },
      ];
    }

    if (fw.includes('vitest') || fw.includes('jest') || normalized === 'typescript') {
      return [
        {
          name: 'unit-test',
          description: 'Unit test with describe/it',
          example:
            'describe("add", () => {\n  it("adds numbers", () => {\n    expect(add(1, 2)).toBe(3);\n  });\n});',
          type: 'unit',
        },
        {
          name: 'integration-test',
          description: 'Integration test with setup/teardown',
          example:
            'describe("health", () => {\n  it("returns ok", async () => {\n    const res = await api.get("/health");\n    expect(res.status).toBe(200);\n  });\n});',
          type: 'integration',
        },
        {
          name: 'edge-case',
          description: 'Edge case for invalid inputs',
          example:
            'it("rejects empty payload", () => {\n  expect(() => createUser({})).toThrow();\n});',
          type: 'edge',
        },
      ];
    }

    return [
      {
        name: 'unit-test',
        description: 'Basic unit test pattern',
        example: 'assert add(1, 2) == 3',
        type: 'unit',
      },
      {
        name: 'edge-case',
        description: 'Basic edge case test pattern',
        example: 'assert_throws(invalid_input)',
        type: 'edge',
      },
    ];
  }
}
