export const AVATAR_TEMPLATES = [
  { id: 'grad-cyan', label: 'Cyber Cyan', gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', emoji: 'AI' },
  { id: 'grad-purple', label: 'Nebula Purple', gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', emoji: 'NX' },
  { id: 'grad-emerald', label: 'Matrix Green', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', emoji: 'IO' },
  { id: 'grad-amber', label: 'Sol Amber', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', emoji: 'UX' },
  { id: 'grad-rose', label: 'Synth Rose', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', emoji: 'ML' },
  { id: 'grad-sunset', label: 'Cosmos Red', gradient: 'linear-gradient(135deg, #f43f5e 0%, #ca8a04 100%)', emoji: 'OS' }
];

export function getAvatarTemplate(avatarId) {
  return AVATAR_TEMPLATES.find((template) => template.id === avatarId) || null;
}
