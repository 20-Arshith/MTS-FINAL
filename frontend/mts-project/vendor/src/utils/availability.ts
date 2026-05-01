export const TIME_OPTIONS = [
    '06:00', '07:00', '08:00', '09:00', '10:00',
    '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00',
];

export type DayConfig = {
    day_of_week: number;
    day_label: string;
    short_label?: string;
    is_active: boolean;
    start_time: string;
    end_time: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTimeLabel = (value: string) => {
    const [rawHours = '0', rawMinutes = '00'] = value.split(':');
    const hours = Number(rawHours);
    const minutes = Number(rawMinutes);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${pad(minutes)} ${suffix}`;
};

export const sortSchedule = (schedule: DayConfig[]) =>
    [...schedule].sort((a, b) => a.day_of_week - b.day_of_week);
