# Browser Preview da NUI

Este repositório inclui um preview estático para testar a experiência de personalização diretamente no navegador, sem depender do runtime do FiveM, natives GTA ou callbacks reais do resource.

## Como abrir

A forma mais simples é abrir o arquivo abaixo no navegador:

```text
web/preview/index.html
```

Se preferir servir por HTTP local, use qualquer servidor estático apontando para a raiz do repositório. Exemplo com Python:

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173/web/preview/
```

## O que o preview cobre

O preview mocka os contratos principais da NUI para validar UX antes de entrar no jogo:

- grade responsiva de thumbnails para roupas, acessórios, cabelo, maquiagem, pai/mãe, tattoos e overlays;
- indicação de drawable, texture, item ativo/inativo e categoria atual;
- rotação horizontal do ped mockado com mouse usando `pointer` events e `requestAnimationFrame`;
- navegação por teclado:
  - `Left` / `Right`: altera drawable;
  - `Up` / `Down`: altera texture;
  - `Q` / `E`: troca categoria;
  - `Space`: ativa/desativa a categoria atual com fallback seguro;
- alternância entre masculino e feminino para validar ranges, cache visual e labels por modelo;
- log dos callbacks mockados equivalentes aos callbacks reais do resource.

## Limitações intencionais

Este preview não executa natives, não renderiza o ped real do GTA e não substitui os testes in-game. Ele existe para validar rapidamente layout, responsividade, atalhos, drag de rotação, fallback de toggle e fluxo de estado antes de integrar alterações na NUI real.

## Relação com o resource

Os arquivos do preview ficam isolados em `web/preview` e não são referenciados pelo `fxmanifest.lua`. Portanto, eles não alteram a UI carregada pelo FiveM e não mudam o core do resource.
