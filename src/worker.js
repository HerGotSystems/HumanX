export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/health')) {
      return json({ ok: true, service: 'humanx', mode: 'aip-first' });
    }

    if (url.pathname === '/api/claims') {
      return json({ claims: demoClaims() });
    }

    if (url.pathname === '/api/ai/analyse') {
      return json({
        error: 'AIP_MODE',
        message: 'HumanX is AIP-first. Public users should copy an AIP task and run it with their own AI. Owner API is not used for free public analysis.'
      }, 402);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*'
    }
  });
}

function demoClaims() {
  return [
    {
      id: 'HX-000001',
      claim: 'The Earth is flat',
      category: 'Cosmology',
      type: 'Physical/Testable',
      status: 'Disproven',
      evidenceScore: 4,
      testability: 98,
      survivability: 2,
      contradictions: 214
    },
    {
      id: 'HX-000002',
      claim: 'Humans landed on the Moon',
      category: 'History/Space',
      type: 'Historical',
      status: 'Strongly Supported',
      evidenceScore: 94,
      testability: 82,
      survivability: 91,
      contradictions: 7
    },
    {
      id: 'HX-000003',
      claim: 'A dream predicted my future',
      category: 'Belief',
      type: 'Religious/Belief',
      status: 'Untestable',
      evidenceScore: 18,
      testability: 7,
      survivability: 48,
      contradictions: 3
    }
  ];
}
