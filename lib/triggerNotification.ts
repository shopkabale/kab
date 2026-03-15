export async function triggerNotification(eventType: string, payload: Record<string, any>) {
  try {
    const response = await fetch('/api/orders/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventType, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger notification');
    }

    return data;
  } catch (error) {
    console.error(`Error triggering ${eventType}:`, error);
    throw error; 
  }
}
