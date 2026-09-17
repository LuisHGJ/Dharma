# Identidade Visual - Dharma

## Paleta de Cores

| Uso | Cor | Hex | Proporção |
|-----|-----|-----|-----------|
| Fundo | ![#060709](https://via.placeholder.com/15/060709/060709.png) | `#060709` | 70% |
| Primária | ![#0A0D11](https://via.placeholder.com/15/0A0D11/0A0D11.png) | `#0A0D11` | 20% |
| Secundária | ![#C9CDD8](https://via.placeholder.com/15/C9CDD8/C9CDD8.png) | `#C9CDD8` | 10% |

## Fonte

- **Cor**: Branca (`#FFFFFF`)
- **Família**: System UI / sans-serif

## Tema

**Escuro**

## Regra 70-20-10

- **70%** — Cor de fundo (`#060709`)
- **20%** — Cor primária (`#0A0D11`)
- **10%** — Cor secundária (`#C9CDD8`)

## Regras CSS

### Feedback do Usuário

- **NUNCA** usar `alert()`, `confirm()` ou `prompt()` do navegador
- Sempre usar componentes customizados:
  - **Toast**: para notificações simples (sucesso, erro)
  - **Modal de confirmação**: para ações destrutivas (excluir, deletar)
- O Toast deve ter barra de progresso animada indicando tempo restante
- Cores do toast: verde (`#22C55E`) para sucesso, vermelho (`#EF4444`) para erro
- Fonte do toast: branca
