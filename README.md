# Vitaju

Aplicativo mobile em React Native para apoiar a prática de exercícios leves por
pessoas 50+, com interface acessível e captura experimental de movimentos. A
detecção usa MediaPipe no aparelho; o backend Spring Boot guarda somente
resumos das sessões, sem receber imagens ou vídeos. O app usa Expo SDK 58 e
React Native 0.88.

## Pré-requisitos

- Node.js e npm.
- JDK 17 ou superior para o backend. O Maven Wrapper baixa o Maven necessário
  automaticamente; não é preciso instalar Maven globalmente.
- Android Studio/SDK para executar no Android, ou Xcode para iOS.
- Docker Desktop para iniciar o PostgreSQL localmente.

## Iniciar o backend

Na pasta `meu-app-vitaju/backend`:

```bash
docker compose up -d database
./mvnw spring-boot:run
```

O PostgreSQL do Vitaju é publicado na porta `5433` do computador para não
conflitar com instalações locais que já usam a porta padrão `5432`.
O banco aceita conexões somente do próprio computador; o celular se comunica
com a API, não diretamente com o PostgreSQL.
No Windows PowerShell, use `.\mvnw.cmd spring-boot:run`. Na primeira execução,
o wrapper baixa o Maven 3.9.16. O JDK 17+ precisa estar instalado e disponível
no terminal; o projeto compila para Java 17, inclusive usando um JDK 24.
Se `java -version` mostrar um JRE antigo, configure `JAVA_HOME` para a pasta do
JDK (a que contém `bin\javac.exe`) antes de iniciar. Por exemplo:

```powershell
$env:JAVA_HOME = "C:\caminho\para\o\JDK"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
.\mvnw.cmd spring-boot:run
```

A API fica em `http://localhost:8080`. Verifique se está ativa em
`http://localhost:8080/api/health`. Ela oferece `POST /api/sessions`,
`GET /api/sessions` (até 50 sessões recentes) e `GET /api/sessions/{id}`.
As sessões persistem em PostgreSQL; os testes usam H2 em memória.

## Configurar e executar o aplicativo

Na pasta `meu-app-vitaju`:

1. Copie `.env.example` para `.env`.
2. Troque `EXPO_PUBLIC_API_URL` pelo endereço IP local do computador, por
   exemplo `http://192.168.1.10:8080`. No emulador Android, use
   `http://10.0.2.2:8080`. O celular e o computador devem estar na mesma rede.
3. Gere o projeto nativo e o APK de desenvolvimento local:

```powershell
npm install
npx expo prebuild
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\android\gradlew.bat -p android assembleDebug
```

O APK será gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.
Instale esse APK no celular e abra o projeto com `npm start -- --lan`; no
development client do Vitaju, conecte ao servidor Metro exibido no terminal.
Não é necessário usar USB nem iniciar um emulador: transfira o APK ao celular
por um meio privado e mantenha computador e celular na mesma rede Wi-Fi.

Para iOS, execute `npm run ios` em um Mac com Xcode. Depois de alterar plugins
nativos, refaça o prebuild. O projeto exige um development build; o Expo Go
padrão não inclui Vision Camera nem MediaPipe.
O build de protótipo permite HTTP para alcançar o backend local; use HTTPS
antes de publicar o app fora de um ambiente de desenvolvimento.

## Dados e limites de privacidade

A câmera e o modelo MediaPipe processam os quadros localmente. O app não envia
foto, vídeo, pontos de pose, nome ou idade do perfil. Ao salvar a sessão, envia
à API apenas o identificador e nome do exercício, duração, movimentos contados,
quadros detectados e horário de início. O `.env` contém somente o endereço
local da API e é ignorado pelo Git; não coloque tokens ou senhas em variáveis
`EXPO_PUBLIC_*`, pois elas são incorporadas ao JavaScript do app.

O APK de desenvolvimento é construído localmente pelo Gradle. Ele precisa do
Metro para carregar o JavaScript durante os testes; os dados resumidos são
transmitidos por HTTP na rede local. A API deste protótipo não tem autenticação,
então use apenas uma rede Wi-Fi privada e confiável, não configure
redirecionamento de portas no roteador e não publique o backend na internet.
Isso reduz a exposição no teste, mas não é uma garantia contra todo acesso ou
interceptação. Antes de qualquer publicação, implemente autenticação,
autorização, HTTPS e uma política de retenção/exclusão de dados.

## Captura de movimento e privacidade

A câmera frontal e o modelo MediaPipe são usados localmente. A contagem
experimental reconhece ciclos de elevação dos braços apenas no exercício
“Mobilidade dos braços”; nos outros exercícios, a pose é detectada sem
contagem de repetições. A API recebe somente o exercício, duração, quadros
detectados, movimentos contados e horário de início.

Essa detecção é experimental: não avalia postura clínica e não confirma que um
movimento é seguro ou indicado. Os exercícios são informativos e não substituem
a orientação de um profissional de saúde.

## Estrutura

`meu-app-vitaju/` contém o app Expo, e `meu-app-vitaju/backend/` contém a API
Spring Boot e sua configuração de banco local. As antigas pastas
`meu-app-vitaju/meu-app-vitamove/` e
`meu-app-vitaju/meu-app-vitamove/meu-app-vitamove/` eram cópias do template
padrão do Expo e foram removidas.
