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
  /** Bottom nav height in px — forwarded to SurveyBanner / SurveyPrompt. */
  bottomOffset?: number;
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
  bottomOffset,
}: SurveyPromptOrBannerProps) {
  if (isPostponed) {
    return (
      <SurveyPrompt
        surveyId={surveyId}
        surveySlug={surveySlug}
        title={title}
        description={description}
        bottomOffset={bottomOffset}
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
      bottomOffset={bottomOffset}
    />
  );
}

function SurveyBannerWithCallback({
  surveyId,
  surveySlug,
  title,
  description,
  onPostponed,
  bottomOffset,
}: {
  surveyId: string;
  surveySlug?: string;
  title: string;
  description: string;
  onPostponed: () => void;
  bottomOffset?: number;
}) {
  return (
    <SurveyBanner
      surveyId={surveyId}
      surveySlug={surveySlug}
      title={title}
      description={description}
      onPlusTard={onPostponed}
      bottomOffset={bottomOffset}
    />
  );
}
