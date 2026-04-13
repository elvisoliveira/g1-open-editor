export const schema = {
  type: 'object',
  required: ['version', 'exportDate', 'presentations'],
  additionalProperties: true,
  properties: {
    version: { type: 'string' },
    exportDate: { type: 'string' },
    presentations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'slides'],
        additionalProperties: true,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slides: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'text'],
              additionalProperties: true,
              properties: {
                id: { type: 'string' },
                text: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};
