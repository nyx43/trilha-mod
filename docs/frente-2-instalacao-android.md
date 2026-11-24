# Guia curto — Instalação, Atualização e Backup do Trilha Mod (Android)

## 1. Artefatos gerados localmente

- **APK assinado (completo, 2 vozes embutidas):** `trilhainfo/releases/current/trilha-mod-<versão>.apk`
- **Manifesto de integridade da entrega:** `trilhainfo/releases/current/release-manifest.json` (contém `contentVersion`, `versionCode`, SHA-256 do APK e permissões)
- **Chave de assinatura (guardada fora do repositório):** `~/.config/trilha-mod-android/release.keystore` e `~/.config/trilha-mod-android/signing.properties` *(faça cópia segura desta pasta — ela garante que futuras versões instalem por cima mantendo seu histórico)*.

## 2. Primeira instalação no Android

1. Copie o arquivo `trilha-mod-*.apk` de `trilhainfo/releases/current/` para o celular (cabo USB ou transferência local).
2. No celular, toque no `.apk` pelo gerenciador de arquivos e autorize **Instalar apps desconhecidos** para o gerenciador (apenas uma vez).
3. Conclua a instalação.
4. **Teste em modo avião:** ative o modo avião antes da primeira abertura, abra o **Trilha Mod**, acesse uma aula, execute um exercício (SQL, Python ou Playground), toque **Ouvir apresentação** e volte usando o botão **Voltar** do Android.

## 3. Atualização conjunta (Web local + Android)

Sempre que concluir edições nas matérias ou no app, execute na raiz de `trilhainfo`:

```sh
npm run release:joint
```

O comando:
1. Congela a versão de conteúdo (`contentVersion`) e incrementa automaticamente o `versionCode`.
2. Gera a web (`dist/`) e o bundle offline Android (`dist-android/`).
3. Valida paridade de catálogo/narração e ausência de chamadas remotas/tutor/telemetria no bundle Android.
4. Compila e assina o APK com a mesma chave estável (`br.dev.trilhamod.offline`).
5. Só promove `releases/current/` se **Web e Android** passarem em todas as checagens. Em caso de falha, a entrega anterior permanece íntegra.

Para atualizar o celular, transfira o novo APK e instale **por cima da versão anterior** (sem desinstalar) — o Android preserva todo o progresso salvo. Confira a versão de conteúdo no rodapé das duas interfaces (`Web · conteúdo ...` e `App offline · conteúdo ...`).

### Modo opcional com pacote de áudio externo (se o APK crescer demais com as matérias 26.2)

```sh
npm run release:joint -- --audio-mode=external
```

Isso gera um APK leve (sem `narration/`) + `trilha-audio-pack-<versão>.zip` (com verificação SHA-256 por arquivo). No celular, abra **Meu espaço → Vozes e pacotes de áudio locais → Importar pacote de áudio (.zip)**.

## 4. Backup e transferência de progresso (PC ↔ Celular)

1. Abra **Meu espaço** (`/profile`) no computador ou no celular.
2. Em **Backup e restauração do progresso**, toque em **Exportar backup (.json)**. O arquivo inclui aulas concluídas, primeiras tentativas, revisão espaçada, notas, trilhas pessoais, rascunhos de sugestões e posição de leitura/áudio, assinado com SHA-256.
3. No outro aparelho, abra **Meu espaço** e toque em **Restaurar backup (.json)**. Se o arquivo estiver inválido ou corrompido, a restauração é recusada e o histórico atual permanece intacto.
