import api from '@/lib/api';
import { Survey, SurveyAnswerPayload } from '@/types';

export const surveysService = {
  /**
   * Récupère le sondage actuellement actif (sans questions).
   */
  async getActive(config?: { signal?: AbortSignal }): Promise<Survey> {
    const { data } = await api.get('/surveys/active', config);
    return data.data ?? data;
  },

  /**
   * Récupère la structure complète d'un sondage (titre, questions, options).
   * @param id - L'ID du sondage à récupérer.
   */
  async get(id: string): Promise<Survey> {
    const { data } = await api.get(`/surveys/${id}`);
    return data.data ?? data;
  },

  /**
   * Soumet les réponses d'un utilisateur pour un sondage donné.
   * @param surveyId - L'ID du sondage.
   * @param answers - Un tableau d'objets contenant les réponses.
   */
  async submitResponse(
    surveyId: string,
    answers: SurveyAnswerPayload[],
    anonymous: boolean = false
  ): Promise<void> {
    await api.post(`/surveys/${surveyId}/responses`, { answers, anonymous });
  },

  /**
   * Vérifie si l'utilisateur authentifié a déjà répondu à un sondage.
   * @param surveyId - L'ID du sondage.
   */
  async hasAnswered(
    surveyId: string,
    config?: { signal?: AbortSignal }
  ): Promise<{ has_answered: boolean }> {
    const { data } = await api.get(`/surveys/${surveyId}/has-answered`, config);
    return data;
  },
};
