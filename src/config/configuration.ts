export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  session: {
    ttl: parseInt(process.env.SESSION_TTL || '86400', 10),
  },
});
