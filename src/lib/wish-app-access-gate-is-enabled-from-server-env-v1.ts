import { wishAppAccessSecretReadFromServerEnvV1 } from "@/lib/wish-app-access-secret-read-from-server-env-v1";

/** Portão ativo quando o secret de acesso está configurado (não-vazio). */
export function wishAppAccessGateIsEnabledFromServerEnvV1(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return wishAppAccessSecretReadFromServerEnvV1(env).length > 0;
}
