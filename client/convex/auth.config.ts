export default {
  providers: [
    {
      // Укажите домен Issuer из Clerk JWT Template (Convex)
      // Рекомендуется задавать через переменную окружения в Convex Dashboard
      // напр. https://<your>.clerk.accounts.dev
      domain: (globalThis as any)?.process?.env?.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
}


