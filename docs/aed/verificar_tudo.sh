#!/bin/bash
# Compila e executa tudo da pasta docs/aed: C++ e Java, testes e demonstracoes.
# Compara a saida das demonstracoes e dos testes entre as duas linguagens.
# Uso: bash verificar_tudo.sh
set -e
cd "$(dirname "$0")"
TMP=$(mktemp -d)

echo "== C++: compilando"
g++ -std=c++17 -Wall -Wextra testes_estruturas.cpp -o "$TMP/testes_estruturas"
g++ -std=c++17 -Wall -Wextra testes_u2.cpp -o "$TMP/testes_u2"
g++ -std=c++17 -Wall -Wextra estrutura_base_PI3E2-93.cpp -o "$TMP/demo_u1"
g++ -std=c++17 -Wall -Wextra demo_u2.cpp -o "$TMP/demo_u2"

echo "== Java: compilando"
mkdir "$TMP/java"
javac -nowarn -d "$TMP/java" conexao_poo_PI3E2-94.java integracao_poo_u2.java TestesEstruturas.java TestesU2.java 2>/dev/null

echo "== Testes C++"
"$TMP/testes_estruturas" > "$TMP/tc1.txt"; tail -1 "$TMP/tc1.txt"
"$TMP/testes_u2" > "$TMP/tc2.txt"; tail -1 "$TMP/tc2.txt"

echo "== Testes Java"
java -cp "$TMP/java" TestesEstruturas > "$TMP/tj1.txt" 2>/dev/null; tail -1 "$TMP/tj1.txt"
java -cp "$TMP/java" TestesU2 > "$TMP/tj2.txt" 2>/dev/null; tail -1 "$TMP/tj2.txt"

echo "== Comparando saidas C++ x Java"
"$TMP/demo_u1" > "$TMP/dc1.txt"
"$TMP/demo_u2" > "$TMP/dc2.txt"
java -cp "$TMP/java" TesteModeloDominio > "$TMP/dj1.txt" 2>/dev/null
java -cp "$TMP/java" DemonstracaoU2 > "$TMP/dj2.txt" 2>/dev/null
comparar() {
    if diff "$1" "$2" > /dev/null; then echo "$3: saidas identicas"; else echo "$3: saidas DIFERENTES"; diff "$1" "$2"; exit 1; fi
}
comparar "$TMP/dc1.txt" "$TMP/dj1.txt" "Demonstracao U1"
comparar "$TMP/dc2.txt" "$TMP/dj2.txt" "Demonstracao U2"
# Nos testes da U1 so muda a palavra do retorno de falha (C++ false, Java null)
sed 's/ devolve null$/ devolve false/' "$TMP/tj1.txt" > "$TMP/tj1n.txt"
comparar "$TMP/tc1.txt" "$TMP/tj1n.txt" "Testes U1 (false e null tratados como iguais)"
comparar "$TMP/tc2.txt" "$TMP/tj2.txt" "Testes U2"

if command -v valgrind >/dev/null 2>&1; then
    echo "== Valgrind (vazamentos de memoria)"
    for p in demo_u1 testes_estruturas demo_u2 testes_u2; do
        valgrind -q --leak-check=full --error-exitcode=9 "$TMP/$p" > /dev/null && echo "$p: sem vazamentos"
    done
else
    echo "== Valgrind nao encontrado: etapa de memoria ignorada"
fi

rm -rf "$TMP"
echo "== Tudo certo"
