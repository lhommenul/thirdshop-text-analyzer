/**
 * Script pour exécuter tous les tests de normalisation
 * et générer un rapport complet
 * 
 * Usage: deno run -A test_normalize_all.ts
 */

// deno-lint-ignore-file no-explicit-any
const globalDeno = (globalThis as any).Deno;

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║  Suite de tests complète: Normalisation HTML                 ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  testCount?: { passed: number; total: number };
}

const results: TestResult[] = [];

async function runTestFile(name: string, filePath: string, extraArgs: string[] = []): Promise<TestResult> {
  console.log(`\n📝 Exécution: ${name}`);
  console.log(`   Fichier: ${filePath}`);
  
  const start = performance.now();
  
  const cmd = new globalDeno.Command("deno", {
    args: ["test", ...extraArgs, filePath],
    stdout: "piped",
    stderr: "piped",
  });
  
  const output = await cmd.output();
  const end = performance.now();
  const duration = end - start;
  
  const success = output.code === 0;
  const stdout = new TextDecoder().decode(output.stdout);
  
  // Extraire le nombre de tests passés
  const match = stdout.match(/(\d+) passed/);
  const passedMatch = stdout.match(/(\d+) passed.*?(\d+) failed/);
  
  let testCount;
  if (passedMatch) {
    const passed = parseInt(passedMatch[1], 10);
    const failed = parseInt(passedMatch[2], 10);
    testCount = { passed, total: passed + failed };
  } else if (match) {
    const passed = parseInt(match[1], 10);
    testCount = { passed, total: passed };
  }
  
  console.log(`   Résultat: ${success ? "✅ SUCCÈS" : "❌ ÉCHEC"}`);
  if (testCount) {
    console.log(`   Tests: ${testCount.passed}/${testCount.total} passés`);
  }
  console.log(`   Durée: ${duration.toFixed(0)}ms`);
  
  return { name, success, duration, testCount };
}

async function main() {
  try {
    // 1. Tests unitaires
    results.push(await runTestFile(
      "Tests unitaires",
      "src/text/normalize_test.ts"
    ));
    
    // 2. Tests d'intégration
    results.push(await runTestFile(
      "Tests d'intégration (dataset)",
      "src/text/normalize_integration_test.ts",
      ["--allow-read"]
    ));
    
    // 3. Tests de cas limites
    results.push(await runTestFile(
      "Tests de cas limites",
      "src/text/normalize_edge_cases_test.ts"
    ));
    
    // Rapport final
    console.log("\n\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║  RAPPORT FINAL                                                ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalDuration = 0;
    let allSuccess = true;
    
    for (const result of results) {
      const statusIcon = result.success ? "✅" : "❌";
      console.log(`${statusIcon} ${result.name}`);
      if (result.testCount) {
        console.log(`   ${result.testCount.passed}/${result.testCount.total} tests passés`);
        totalTests += result.testCount.total;
        totalPassed += result.testCount.passed;
      }
      console.log(`   Durée: ${result.duration.toFixed(0)}ms\n`);
      
      totalDuration += result.duration;
      allSuccess = allSuccess && result.success;
    }
    
    console.log("─────────────────────────────────────────────────────────────────");
    console.log(`Total: ${totalPassed}/${totalTests} tests passés`);
    console.log(`Durée totale: ${totalDuration.toFixed(0)}ms`);
    console.log(`Taux de réussite: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    console.log("─────────────────────────────────────────────────────────────────\n");
    
    if (allSuccess && totalPassed === totalTests) {
      console.log("🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! 🎉\n");
      console.log("✅ Le module de normalisation est prêt à être utilisé en production.");
      globalDeno.exit(0);
    } else {
      console.log("❌ CERTAINS TESTS ONT ÉCHOUÉ\n");
      console.log("Veuillez corriger les erreurs avant de continuer.");
      globalDeno.exit(1);
    }
    
  } catch (error: any) {
    console.error("\n❌ Erreur lors de l'exécution des tests:", error.message);
    globalDeno.exit(1);
  }
}

// @ts-ignore: main property may not exist
if ((import.meta as any).main !== false) {
  main();
}

