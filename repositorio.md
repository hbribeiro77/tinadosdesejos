# Repositório — como publicar alterações

Fluxo sugerido no **PowerShell** (na pasta do projeto):

1. `git status` — conferir o que mudou.
2. `git add -A` — preparar arquivos (ajuste se preferir commits menores).
3. `git commit -m "Mensagem clara em português"` — criar o commit.
4. `git push` — enviar para o remoto configurado (`origin`) no branch atual.

Se o remoto ainda não existir, configure com `git remote add origin <URL_DO_SEU_GITLAB>` e faça o primeiro `git push -u origin <branch>`.
