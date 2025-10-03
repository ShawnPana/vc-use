import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  accent: string;
  status: string;
}

interface AgentStatusTimelineProps {
  agents: Agent[];
}

export function AgentStatusTimeline({ agents }: AgentStatusTimelineProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      marginTop: '1rem',
    }}>
      {agents.map((agent, index) => {
        const Icon = agent.icon;

        // Determine status styling
        let statusColor = '#a1a1aa'; // default/loading gray
        let statusBg = 'rgba(161, 161, 170, 0.1)';

        if (agent.status === 'completed') {
          statusColor = '#34d399'; // green
          statusBg = 'rgba(52, 211, 153, 0.15)';
        } else if (agent.status === 'error') {
          statusColor = '#f87171'; // red
          statusBg = 'rgba(248, 113, 113, 0.15)';
        } else if (agent.status === 'loading') {
          statusColor = '#facc15'; // yellow
          statusBg = 'rgba(250, 204, 21, 0.15)';
        }

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: statusBg,
              border: `1px solid ${statusColor}`,
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--color-foreground)',
              position: 'relative',
            }}
            title={`${agent.name} - ${agent.status}`}
          >
            <Icon
              size={14}
              style={{ color: statusColor }}
            />
            <span>{agent.name}</span>
            {agent.status === 'loading' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: statusColor,
                  marginLeft: '0.25rem',
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
