import { useEffect, useRef, useState } from 'react';

interface Event {
  id: number;
  title: string;
  startDate: string | Date;
  type?: 'personal' | 'professional' | 'meeting' | 'reminder';
  location?: string | null;
}

interface UseEventNotificationsOptions {
  events: Event[];
  enabled?: boolean;
  notificationMinutes?: number;
}

/**
 * Hook personalizado para gestionar notificaciones de eventos próximos
 * Solicita permisos y envía notificaciones push del navegador
 */
export function useEventNotifications({
  events,
  enabled = true,
  notificationMinutes = 15,
}: UseEventNotificationsOptions) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedEventsRef = useRef<Set<number>>(new Set());

  // Solicitar permisos de notificaciones
  useEffect(() => {
    if (!enabled || !('Notification' in window)) {
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, [enabled]);

  // Verificar eventos próximos y enviar notificaciones
  useEffect(() => {
    if (!enabled || permission !== 'granted' || !events.length) {
      return;
    }

    const checkUpcomingEvents = () => {
      const now = new Date();
      const notificationTime = notificationMinutes * 60 * 1000; // Convertir a milisegundos

      events.forEach((event) => {
        // Solo notificar eventos tipo "meeting" o "reminder"
        if (event.type !== 'meeting' && event.type !== 'reminder') {
          return;
        }

        // Evitar notificaciones duplicadas
        if (notifiedEventsRef.current.has(event.id)) {
          return;
        }

        const eventStart = new Date(event.startDate);
        const timeUntilEvent = eventStart.getTime() - now.getTime();

        // Verificar si el evento está en el rango de notificación (±1 minuto de margen)
        if (timeUntilEvent > 0 && timeUntilEvent <= notificationTime + 60000) {
          sendNotification(event);
          notifiedEventsRef.current.add(event.id);
        }
      });
    };

    // Verificar inmediatamente
    checkUpcomingEvents();

    // Verificar cada minuto
    const interval = setInterval(checkUpcomingEvents, 60000);

    return () => clearInterval(interval);
  }, [events, enabled, permission, notificationMinutes]);

  const sendNotification = (event: Event) => {
    const eventTime = new Date(event.startDate).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const body = [
      `Hora: ${eventTime}`,
      event.location ? `Ubicación: ${event.location}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const notification = new Notification(`📅 ${event.title}`, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `event-${event.id}`, // Evita duplicados
      requireInteraction: false,
      silent: false,
    });

    // Auto-cerrar después de 10 segundos
    setTimeout(() => notification.close(), 10000);

    // Opcional: hacer algo cuando se hace clic en la notificación
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm === 'granted';
    }
    return false;
  };

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
  };
}
