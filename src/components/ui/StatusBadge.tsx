import { STATUS_LABEL, type FeatureStatus } from '../../core/feature-registry/registry';

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
