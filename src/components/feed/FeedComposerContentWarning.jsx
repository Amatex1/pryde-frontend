const CONTENT_WARNING_OPTIONS = [
  { value: '', label: 'Select a content warning...' },
  { value: 'Artistic Nudity', label: 'Artistic Nudity' },
  { value: 'Suggestive (Non-Explicit)', label: 'Suggestive (Non-Explicit)' },
  { value: 'Sexual Discussion', label: 'Sexual Discussion' },
  { value: 'Mental Health', label: 'Mental Health' },
  { value: 'Violence', label: 'Violence' },
  { value: 'Self-Harm', label: 'Self-Harm' },
  { value: 'Substance Use', label: 'Substance Use' },
  { value: 'Death/Grief', label: 'Death/Grief' },
  { value: 'Eating Disorders', label: 'Eating Disorders' },
  { value: 'Abuse', label: 'Abuse' },
  { value: 'Discrimination', label: 'Discrimination' },
  { value: 'Medical Content', label: 'Medical Content' },
  { value: 'Flashing Lights', label: 'Flashing Lights' },
  { value: 'Spoilers', label: 'Spoilers' },
  { value: 'Other', label: 'Other (describe below)' },
];

export default function FeedComposerContentWarning({
  isMobile,
  showContentWarning,
  contentWarning,
  idPrefix = '',
  onSetContentWarning,
}) {
  if (!showContentWarning) {
    return null;
  }

  const knownValues = CONTENT_WARNING_OPTIONS.map((option) => option.value);
  const isCustom = contentWarning && !knownValues.includes(contentWarning);
  const selectValue = isCustom ? 'Other' : contentWarning;

  return (
    <div className="content-warning-input">
      <select
        id={`${idPrefix}content-warning-select`}
        name={`${idPrefix}contentWarning`}
        value={selectValue}
        onChange={(e) => onSetContentWarning(e.target.value)}
        className={`cw-input ${!isMobile ? 'glossy' : ''}`}
      >
        {CONTENT_WARNING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {(selectValue === 'Other' || isCustom) && (
        <input
          type="text"
          className="cw-custom-input"
          placeholder="Describe the content warning..."
          value={isCustom ? contentWarning : ''}
          onChange={(e) => onSetContentWarning(e.target.value || 'Other')}
          maxLength={100}
          autoFocus
        />
      )}
    </div>
  );
}