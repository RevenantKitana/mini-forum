import { Response } from 'express';

interface SSEClient {
  id: string;
  userId: number;
  res: Response;
}

const clients: Map<string, SSEClient> = new Map();

export function addClient(userId: number, res: Response): string {
  const clientId = `${userId}-${Date.now()}`;
  clients.set(clientId, { id: clientId, userId, res });

  res.on('close', () => {
    clients.delete(clientId);
  });

  return clientId;
}

export function removeClient(clientId: string): void {
  clients.delete(clientId);
}

export function sendToUser(userId: number, event: string, data: any): void {
  for (const client of clients.values()) {
    if (client.userId === userId) {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }
}

export function broadcastToAll(event: string, data: any): void {
  for (const client of clients.values()) {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export function getConnectedUserIds(): number[] {
  const userIds = new Set<number>();
  for (const client of clients.values()) {
    userIds.add(client.userId);
  }
  return Array.from(userIds);
}
