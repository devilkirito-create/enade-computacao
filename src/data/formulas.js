export const formulas = [
  {
    topic: "calculo",
    title: "Resfriamento de Newton",
    body: "dT/dt = −k (T − A)\nT(t) = (T(0) − A) e^(−kt) + A\nA é a temperatura ambiente. O sinal negativo faz o corpo ir em direção a A.",
  },
  {
    topic: "calculo",
    title: "Pressão hidrostática",
    body: "P = ρ g h\nágua do mar típica na prova: ρ = 1,025×10³ kg/m³, g = 9,8 m/s².\nP cresce linearmente com a profundidade e passa pela origem se P for só a coluna d'água.",
  },
  {
    topic: "estatistica",
    title: "Desvio-padrão",
    body: "Populacional: σ = sqrt( Σ (x − μ)² / N )\nAmostral: s = sqrt( Σ (x − x̄)² / (N − 1) )\nDispersão relativa (CV) = σ / μ. Se todos os dados são multiplicados por c > 0, σ também multiplica por c e o CV não muda.",
  },
  {
    topic: "estatistica",
    title: "Mínimos quadrados da reta",
    body: "y = m x + c, pontos (x_i, y_i).\nA = [x_i  1], X = [m c]ᵀ, B = [y_i]\nResolva Aᵀ A X = Aᵀ B.",
  },
  {
    topic: "otimizacao",
    title: "Lagrange e programação linear",
    body: "Minimizar f sujeito a g = 0: ∇f = λ ∇g, junto com g = 0.\nEm PL o ótimo de uma função linear está num vértice da região viável.\nTransporte: min Σ c_ij y_ij, com oferta Σ_j y_ij ≤ S_i e demanda Σ_i y_ij ≥ d_j.",
  },
  {
    topic: "circuitos",
    title: "CA, RMS e impedância",
    body: "v(t) = Vm sen(2π f t)\nVrms = Vm / sqrt(2)\nCarga resistiva: v e i em fase. Capacitiva: i adianta. Indutiva: i atrasa.\n|Z| = Vm / Im quando se lê pico com pico.",
  },
  {
    topic: "circuitos",
    title: "Flexão em 3 pontos",
    body: "σ = 3 F L / (2 w h²)\nF proporcional a w h² se σ e L são iguais.\nLargura ×3 e espessura ×1/2 ⇒ força × 3 × (1/2)² = 75%.",
  },
  {
    topic: "digitais",
    title: "Prioridade e máscara de bits",
    body: "Campo nos bits 5..3: máscara 0x38.\nAmbas as bordas = 011 nesses bits = 0x18.\nAtualização: reg = (reg & ~0x38) | 0x18\nOR liga bits, AND com máscara invertida apaga o campo, XOR inverte.",
  },
  {
    topic: "sinais",
    title: "Frequência normalizada e Nyquist",
    body: "Ω = 2π f / fs   (radianos discretos)\nfs = 20 kHz e corte em 6 kHz ⇒ Ωc = 0,6π.\nNyquist: fs > 2 fmax para reconstruir sem aliasing.\nComprimento crítico de trilha (ordem de grandeza da prova): Lc = Vp · th / 2, com th ligado ao período do sinal e Vp ≈ 15 cm/ns em stripline FR4.",
  },
  {
    topic: "controle",
    title: "PID e 1ª ordem",
    body: "saída = kp·e + ki·∫e dt + kd·de/dt\nMalha fechada de 1ª ordem: T(s) = 1 / (τs + 1)\n4 constantes de tempo ≈ acomodação de 2%. Se ts = 1 s, τ = 0,25 s.\nRealimentação unitária: G = T / (1 − T).",
  },
  {
    topic: "algoritmos",
    title: "Somas que caem na prova",
    body: "1+2+…+(N−1) = N(N−1)/2   → comparações do algoritmo ingênuo de eliminar duplicatas.\nDepois de ordenar, eliminar duplicatas adjacentes custa N−1 comparações.\nMergeSort: se hi <= lo return; mid = lo+(hi−lo)/2; sort(lo,mid); sort(mid+1,hi); merge.\nQuicksort: após o pivô em x, recursão em [ini, x−1] e [x+1, fim].",
  },
  {
    topic: "estruturas",
    title: "Árvores e filas",
    body: "BST: esquerda < nó < direita.\nAVL: |altura(esq) − altura(dir)| ≤ 1 em todo nó.\nFila: insere no fim, remove do início (FIFO).\nPilha: insere e remove no mesmo extremo (LIFO).\nVetor dinâmico que dobra: inserções amortizadas O(1).",
  },
  {
    topic: "redes",
    title: "Grafos de rede",
    body: "Dijkstra: caminho mínimo com custos positivos, a partir de uma origem.\nMST (Kruskal): ordenar arestas, aceitar se não forma ciclo. n nós ⇒ n−1 arestas.\nOSPF usa Dijkstra dentro do sistema autônomo.\nSpanning tree de difusão evita pacote repetido.",
  },
  {
    topic: "so",
    title: "Memória e escalonamento",
    body: "First-fit: primeira partição que cabe.\nBest-fit: sobra a menor.\nWorst-fit: sobra a maior.\nRound-robin: quantum pequeno melhora resposta e aumenta troca de contexto.\nPaginação: endereço virtual → página + deslocamento → moldura.\nCondição de corrida: proteja o dado compartilhado com a mesma trava (o objeto do servlet, não o request).",
  },
  {
    topic: "bd",
    title: "SQL e permissão",
    body: "Coluna nova: ALTER TABLE, não INSERT.\nDELETE com OR largo apaga mais do que a intenção.\nGRANT concede, REVOKE retira, DENY (SQL Server) vence o GRANT.\nWITH GRANT OPTION permite repassar privilégio.\nChave estrangeira aponta para a chave primária referenciada.",
  },
  {
    topic: "es",
    title: "Padrões que o ENADE cobra",
    body: "Strategy: família de algoritmos intercambiáveis atrás de uma interface.\nRigidez: uma mudança dispara mudanças em cascata (switch por tipo é o sintoma clássico).\nTimebox: o prazo é fixo e o escopo cede; entra primeiro o requisito mais valioso.\nSingleton não é o mecanismo certo para escolher estratégia.",
  },
  {
    topic: "seguranca",
    title: "Peças de segurança",
    body: "Firewall de rede filtra pacote; firewall de aplicação enxerga conteúdo e é mais detalhado.\nIDS detecta. IPS detecta e bloqueia em linha.\nAntivírus de gateway olha conteúdo (assinatura), em geral acima da camada de rede.\nCanal camuflado não é o trabalho típico de um firewall.\n3DES-EDE com k1=k2=k3 decifra um DES simples: D(C(D(c))).",
  },
  {
    topic: "ihc",
    title: "ISO 9126 — inteligibilidade",
    body: "Inteligibilidade: esforço para reconhecer o conceito lógico e a aplicabilidade.\nAprendizado: esforço para aprender a usar.\nOperabilidade: esforço para operar e controlar.\nAtratividade: satisfação subjetiva.\nAcessibilidade não é “alguém ajuda a pessoa”; é o espaço ou o serviço ser usável de forma autônoma.",
  },
  {
    topic: "fg",
    title: "Como fechar questão de asserções",
    body: "A  I e II verdadeiras, e II justifica I.\nB  I e II verdadeiras, mas II não justifica I.\nC  I verdadeira, II falsa.\nD  I falsa, II verdadeira.\nE  ambas falsas.\nJustificar significa que II é a razão de I, não apenas outro fato verdadeiro do mesmo texto.",
  },
];
