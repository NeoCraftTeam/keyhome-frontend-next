import { PublicSurvey, SurveyAnswerPayload } from '@/types';
import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Unauthenticated axios instance — no Bearer token, no credentials needed. */
const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

/** Retrieve or generate a stable anonymous client token stored in localStorage. */
export function getClientToken(): string {
  if (typeof window === 'undefined') return '';
  const key = 'kh_survey_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

export const publicSurveysService = {
  /** List all publicly-visible active surveys. */
  async list(): Promise<PublicSurvey[]> {
    const { data } = await publicApi.get('/public/surveys');
    return (data.data ?? data) as PublicSurvey[];
  },

  /** Fetch a single public survey by slug, including dedup status. */
  async get(slug: string): Promise<PublicSurvey> {
    const clientToken = getClientToken();
    const params = clientToken ? { client_token: clientToken } : {};
    const { data } = await publicApi.get(`/public/surveys/${slug}`, { params });
    return data as PublicSurvey;
  },

  /** Submit anonymous answers for a public survey. */
  async submit(
    slug: string,
    answers: SurveyAnswerPayload[]
  ): Promise<{ submitted: boolean; already_submitted?: boolean }> {
    const clientToken = getClientToken();
    const { data } = await publicApi.post(`/public/surveys/${slug}/respond`, {
      client_token: clientToken,
      answers,
    });
    return data;
  },
};
