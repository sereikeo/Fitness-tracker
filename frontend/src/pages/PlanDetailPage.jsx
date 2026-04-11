import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((plan) => {
        if (plan.program_id) {
          navigate(`/plans/programs/${plan.program_id}`, { replace: true });
        } else {
          navigate('/plans', { replace: true });
        }
      })
      .catch(() => navigate('/plans', { replace: true }));
  }, [id]);

  return null;
}