import { nanoid } from 'nanoid';

export const generateEventId = () => nanoid(10);
export const generateAdminToken = () => nanoid(20);
export const generateShareToken = () => nanoid(12);
export const generateChildId = () => nanoid(8);
