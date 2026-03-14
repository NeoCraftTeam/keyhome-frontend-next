'use client';

import SurveyBanner from './SurveyBanner';
import SurveyPrompt from './SurveyPrompt';

interface SurveyPromptOrBannerProps {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  isPostponed: boolean;
  onPostponed: () => void;
}

/**
 * Affiche SurveyBanner (première fois) ou SurveyPrompt (après "Plus tard").
 * Le prompt flottant ne s'affiche qu'après que l'utilisateur a cliqué "Plus tard".
 */
export default function SurveyPromptOrBanner({
  surveyId,
  surveySlug,
  title,
  description,
  isPostponed,
  onPostponed,
}: SurveyPromptOrBannerProps) {
  if (isPostponed) {
    return (
      <SurveyPrompt
        surveyId={surveyId}
        surveySlug={surveySlug}
        title={title}
        description={description}
      />
    );
  }

  return (
    <SurveyBannerWithCallback
      surveyId={surveyId}
      surveySlug={surveySlug}
      title={title}
      description={description}
      onPostponed={onPostponed}
    />
  );
}

function SurveyBannerWithCallback({
  surveyId,
  surveySlug,
  title,
  description,
  onPostponed,
}: {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  onPostponed: () => void;
}) {
  return (
    <SurveyBanner
      surveyId={surveyId}
      surveySlug={surveySlug}
      title={title}
      description={description}
      onPlusTard={onPostponed}
    />
  );
}
