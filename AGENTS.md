# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Tornar um usuário admin

O acesso admin (aba Admin, painel de banners, RLS) é controlado pela coluna `profiles.is_admin`.
Para promover um usuário, rode no SQL Editor do Supabase:

```sql
UPDATE profiles SET is_admin = true WHERE id = 'uuid-do-usuario';
```
