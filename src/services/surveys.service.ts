import api from '@/lib/api';
import { Survey, SurveyAnswerPayload } from '@/types';

export const surveysService = {
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
    answers: SurveyAnswerPayload[]
  ): Promise<void> {
    await api.post(`/surveys/${surveyId}/responses`, { answers });
  },
};
