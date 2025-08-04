# Tests de Performance

## Vue d'ensemble

Ce document présente la stratégie et les outils de tests de performance pour l'application, couvrant les tests de charge, les tests de stress, les métriques de performance et l'optimisation.

## Types de Tests de Performance

### Tests de Charge (Load Testing)

- **Objectif** : Vérifier les performances sous une charge normale attendue
- **Métriques** : Temps de réponse, débit, utilisation des ressources
- **Outils** : Apache JMeter, Artillery, k6

### Tests de Stress (Stress Testing)

- **Objectif** : Déterminer les limites du système
- **Métriques** : Point de rupture, récupération après surcharge
- **Outils** : JMeter, Gatling, Artillery

### Tests de Volume (Volume Testing)

- **Objectif** : Performance avec de gros volumes de données
- **Métriques** : Temps de traitement, consommation mémoire
- **Outils** : Scripts PHP personnalisés, bases de données test

### Tests de Pic (Spike Testing)

- **Objectif** : Réaction aux augmentations soudaines de charge
- **Métriques** : Temps de récupération, stabilité
- **Outils** : k6, Artillery

## Configuration des Tests

### Apache JMeter - Tests Backend

```xml
<!-- jmeter-test-plan.jmx -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="API Performance Test">
      <stringProp name="TestPlan.comments">Tests de performance API REST</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>

      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">https://api.example.com</stringProp>
          </elementProp>
          <elementProp name="USERS" elementType="Argument">
            <stringProp name="Argument.name">USERS</stringProp>
            <stringProp name="Argument.value">100</stringProp>
          </elementProp>
          <elementProp name="RAMP_TIME" elementType="Argument">
            <stringProp name="Argument.name">RAMP_TIME</stringProp>
            <stringProp name="Argument.value">60</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>

    <hashTree>
      <!-- Thread Group pour simulation d'utilisateurs -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="User Load">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">10</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${USERS}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${RAMP_TIME}</stringProp>
        <longProp name="ThreadGroup.start_time">1640995200000</longProp>
        <longProp name="ThreadGroup.end_time">1640995200000</longProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
      </ThreadGroup>

      <hashTree>
        <!-- Configuration HTTP -->
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path"></stringProp>
        </ConfigTestElement>

        <!-- Tests des endpoints -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /api/users">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="page" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.name">page</stringProp>
                <stringProp name="Argument.value">1</stringProp>
              </elementProp>
              <elementProp name="limit" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.name">limit</stringProp>
                <stringProp name="Argument.value">20</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain"></stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol"></stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">/api/users</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>

        <!-- Assertions pour vérifier la réponse -->
        <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Assertion">
          <collectionProp name="Asserion.test_strings">
            <stringProp name="49586">200</stringProp>
          </collectionProp>
          <stringProp name="Assertion.custom_message"></stringProp>
          <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
          <boolProp name="Assertion.assume_success">false</boolProp>
          <intProp name="Assertion.test_type">1</intProp>
        </ResponseAssertion>

        <!-- Assertion sur le temps de réponse -->
        <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="Duration Assertion">
          <stringProp name="DurationAssertion.duration">1000</stringProp>
        </DurationAssertion>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### k6 - Tests de Performance JavaScript

```javascript
// performance-tests/k6/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
export const errorRate = new Rate('errors');

// Configuration des tests
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Montée progressive
    { duration: '5m', target: 50 }, // Charge normale
    { duration: '2m', target: 100 }, // Pic de charge
    { duration: '5m', target: 50 }, // Retour à la normale
    { duration: '2m', target: 0 }, // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% des requêtes < 1s
    http_req_failed: ['rate<0.1'], // Moins de 10% d'erreurs
    errors: ['rate<0.1'],
  },
};

// Configuration de base
const BASE_URL = 'https://api.example.com';
const TOKEN = 'your-auth-token-here';

// Headers par défaut
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

export default function () {
  // Test 1: Liste des utilisateurs
  let response = http.get(`${BASE_URL}/api/users?page=1&limit=20`, {
    headers,
  });

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.length > 0;
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);

  // Test 2: Création d'utilisateur
  const userData = {
    firstName: `User${Math.random().toString(36).substr(2, 9)}`,
    lastName: 'Test',
    email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'password123',
  };

  response = http.post(`${BASE_URL}/api/users`, JSON.stringify(userData), {
    headers,
  });

  const createSuccess = check(response, {
    'create status is 201': (r) => r.status === 201,
    'create response time < 1000ms': (r) => r.timings.duration < 1000,
    'user created with correct email': (r) => {
      const body = JSON.parse(r.body);
      return body.email === userData.email;
    },
  });

  if (!createSuccess) {
    errorRate.add(1);
  }

  sleep(2);

  // Test 3: Recherche d'utilisateurs
  const searchTerm = 'test';
  response = http.get(`${BASE_URL}/api/users/search?q=${searchTerm}`, {
    headers,
  });

  const searchSuccess = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 800ms': (r) => r.timings.duration < 800,
    'search returns results': (r) => {
      const body = JSON.parse(r.body);
      return body.data && Array.isArray(body.data);
    },
  });

  if (!searchSuccess) {
    errorRate.add(1);
  }

  sleep(1);
}

// Test de setup avant le test principal
export function setup() {
  // Authentification ou préparation des données
  const authResponse = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const authToken = JSON.parse(authResponse.body).token;
  return { token: authToken };
}

// Nettoyage après les tests
export function teardown(data) {
  // Nettoyage des données de test si nécessaire
  console.log('Tests terminés, nettoyage...');
}
```

### Artillery - Tests de Montée en Charge

```yaml
# performance-tests/artillery/load-test.yml
config:
  target: 'https://api.example.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: 'Warm up'
    - duration: 120
      arrivalRate: 20
      name: 'Normal load'
    - duration: 60
      arrivalRate: 50
      name: 'High load'
    - duration: 60
      arrivalRate: 10
      name: 'Cool down'

  defaults:
    headers:
      'Content-Type': 'application/json'
      'Authorization': 'Bearer YOUR_TOKEN_HERE'

  variables:
    userEmail:
      - 'user1@test.com'
      - 'user2@test.com'
      - 'user3@test.com'

scenarios:
  - name: 'User management workflow'
    weight: 60
    flow:
      - get:
          url: '/api/users'
          capture:
            - json: '$.data[0].id'
              as: 'userId'
      - think: 2
      - get:
          url: '/api/users/{{ userId }}'
      - think: 1
      - put:
          url: '/api/users/{{ userId }}'
          json:
            firstName: 'Updated'
            lastName: 'Name'

  - name: 'Search and filter'
    weight: 30
    flow:
      - get:
          url: '/api/users/search'
          qs:
            q: 'test'
            limit: 10
      - think: 1
      - get:
          url: '/api/users'
          qs:
            role: 'admin'
            page: 1
            limit: 20

  - name: 'Create user'
    weight: 10
    flow:
      - post:
          url: '/api/users'
          json:
            firstName: 'Test'
            lastName: 'User'
            email: '{{ userEmail }}'
            password: 'password123'
```

## Tests de Performance Frontend

### Lighthouse CI - Métriques Web

```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8000',
        'http://localhost:8000/login',
        'http://localhost:8000/dashboard',
        'http://localhost:8000/users',
      ],
      startServerCommand: 'php -S localhost:8000 -t public',
      startServerReadyPattern: 'Development Server',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Accessibilité
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Bonnes pratiques
        'categories:best-practices': ['warn', { minScore: 0.8 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### WebPageTest - Tests de Performance Réels

```javascript
// performance-tests/webpagetest/performance-monitor.js
const WebPageTest = require('webpagetest');
const wpt = new WebPageTest('www.webpagetest.org', 'YOUR_API_KEY');

const testConfig = {
  location: 'Dulles:Chrome',
  runs: 3,
  firstViewOnly: false,
  video: true,
  connectivity: '3G',
  pollResults: 5,
  timeout: 240,
};

async function runPerformanceTest(url) {
  return new Promise((resolve, reject) => {
    wpt.runTest(url, testConfig, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`Test ID: ${data.data.testId}`);
      console.log(`Summary: ${data.data.summary}`);

      // Attendre les résultats
      wpt.getTestResults(data.data.testId, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        const metrics = results.data.runs[1].firstView;

        const performanceData = {
          loadTime: metrics.loadTime,
          firstByte: metrics.TTFB,
          firstContentfulPaint: metrics.firstContentfulPaint,
          largestContentfulPaint: metrics.largestContentfulPaint,
          cumulativeLayoutShift: metrics.chromeUserTiming?.CumulativeLayoutShift,
          speedIndex: metrics.SpeedIndex,
          visualComplete: metrics.visualComplete,
        };

        console.log('Performance Metrics:', performanceData);

        // Vérifier les seuils
        const thresholds = {
          loadTime: 3000,
          firstByte: 800,
          firstContentfulPaint: 2000,
          largestContentfulPaint: 4000,
          speedIndex: 3000,
        };

        const violations = [];
        Object.entries(thresholds).forEach(([metric, threshold]) => {
          if (performanceData[metric] > threshold) {
            violations.push(`${metric}: ${performanceData[metric]}ms > ${threshold}ms`);
          }
        });

        if (violations.length > 0) {
          console.error('Performance violations:', violations);
        }

        resolve(performanceData);
      });
    });
  });
}

// Tests sur différentes pages
const pages = [
  'https://your-app.com',
  'https://your-app.com/login',
  'https://your-app.com/dashboard',
  'https://your-app.com/users',
];

async function runAllTests() {
  for (const page of pages) {
    console.log(`Testing ${page}...`);
    try {
      await runPerformanceTest(page);
    } catch (error) {
      console.error(`Error testing ${page}:`, error);
    }
  }
}

runAllTests();
```

## Tests de Base de Données

### Tests de Performance SQL

```php
<?php
// tests/Performance/DatabasePerformanceTest.php

namespace App\Tests\Performance;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class DatabasePerformanceTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();

        $this->entityManager = static::getContainer()
            ->get('doctrine')
            ->getManager();

        $this->userRepository = $this->entityManager
            ->getRepository(User::class);
    }

    /**
     * @test
     * @group performance
     * @group database
     */
    public function it_should_perform_bulk_insert_efficiently(): void
    {
        // Given
        $numberOfUsers = 1000;
        $users = [];

        // Mesurer le temps de création
        $startTime = microtime(true);

        for ($i = 0; $i < $numberOfUsers; $i++) {
            $user = new User();
            $user->setEmail("user{$i}@test.com");
            $user->setFirstName("User");
            $user->setLastName((string)$i);
            $user->setPassword('hashed_password');

            $users[] = $user;
            $this->entityManager->persist($user);

            // Flush par batch pour optimiser la mémoire
            if (($i % 100) === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
            }
        }

        $this->entityManager->flush();
        $this->entityManager->clear();

        $insertTime = microtime(true) - $startTime;

        // Then
        $this->assertLessThan(5.0, $insertTime, "L'insertion de {$numberOfUsers} utilisateurs doit prendre moins de 5 secondes");

        // Vérifier que tous les utilisateurs ont été créés
        $count = $this->userRepository->count([]);
        $this->assertEquals($numberOfUsers, $count);

        echo "Temps d'insertion pour {$numberOfUsers} utilisateurs: " . round($insertTime, 2) . "s\n";
    }

    /**
     * @test
     * @group performance
     * @group database
     */
    public function it_should_perform_complex_queries_efficiently(): void
    {
        // Given - Créer des données de test
        $this->createTestData(500);

        // Test 1: Requête avec jointures
        $startTime = microtime(true);

        $users = $this->userRepository->createQueryBuilder('u')
            ->leftJoin('u.requests', 'r')
            ->addSelect('r')
            ->where('u.emailVerified = :verified')
            ->andWhere('u.createdAt > :date')
            ->setParameter('verified', true)
            ->setParameter('date', new \DateTime('-30 days'))
            ->orderBy('u.createdAt', 'DESC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();

        $queryTime = microtime(true) - $startTime;

        // Then
        $this->assertLessThan(0.5, $queryTime, 'La requête complexe doit prendre moins de 500ms');
        $this->assertGreaterThan(0, count($users));

        echo "Temps de requête complexe: " . round($queryTime * 1000, 2) . "ms\n";

        // Test 2: Requête d'agrégation
        $startTime = microtime(true);

        $stats = $this->userRepository->createQueryBuilder('u')
            ->select('COUNT(u.id) as total')
            ->addSelect('COUNT(CASE WHEN u.emailVerified = true THEN 1 END) as verified')
            ->addSelect('AVG(TIMESTAMPDIFF(DAY, u.createdAt, CURRENT_TIMESTAMP())) as avgAge')
            ->getQuery()
            ->getSingleResult();

        $aggregateTime = microtime(true) - $startTime;

        $this->assertLessThan(0.2, $aggregateTime, 'La requête d\'agrégation doit prendre moins de 200ms');
        $this->assertArrayHasKey('total', $stats);

        echo "Temps d'agrégation: " . round($aggregateTime * 1000, 2) . "ms\n";
    }

    /**
     * @test
     * @group performance
     * @group database
     */
    public function it_should_handle_pagination_efficiently(): void
    {
        // Given
        $this->createTestData(1000);

        // Test de pagination
        $pageSize = 20;
        $pages = 10;

        $startTime = microtime(true);

        for ($page = 1; $page <= $pages; $page++) {
            $offset = ($page - 1) * $pageSize;

            $users = $this->userRepository->createQueryBuilder('u')
                ->orderBy('u.id', 'ASC')
                ->setFirstResult($offset)
                ->setMaxResults($pageSize)
                ->getQuery()
                ->getResult();

            $this->assertCount($pageSize, $users);
        }

        $paginationTime = microtime(true) - $startTime;

        // Then
        $this->assertLessThan(2.0, $paginationTime, "La pagination de {$pages} pages doit prendre moins de 2 secondes");

        echo "Temps de pagination ({$pages} pages): " . round($paginationTime, 2) . "s\n";
    }

    private function createTestData(int $count): void
    {
        for ($i = 0; $i < $count; $i++) {
            $user = new User();
            $user->setEmail("perf{$i}@test.com");
            $user->setFirstName("Perf");
            $user->setLastName((string)$i);
            $user->setPassword('hashed_password');
            $user->setEmailVerified($i % 2 === 0);
            $user->setCreatedAt(new \DateTime("-{$i} days"));

            $this->entityManager->persist($user);

            if (($i % 100) === 0) {
                $this->entityManager->flush();
                $this->entityManager->clear();
            }
        }

        $this->entityManager->flush();
        $this->entityManager->clear();
    }
}
```

## Monitoring et Métriques

### Scripts de Monitoring

```bash
#!/bin/bash
# scripts/performance-monitor.sh

# Configuration
DOMAIN="your-app.com"
LOG_FILE="performance-results.log"

echo "=== Performance Monitoring - $(date) ===" >> $LOG_FILE

# Test de temps de réponse
echo "Testing response times..." >> $LOG_FILE
curl -w "@curl-format.txt" -o /dev/null -s "https://$DOMAIN" >> $LOG_FILE
curl -w "@curl-format.txt" -o /dev/null -s "https://$DOMAIN/api/users" >> $LOG_FILE

# Test de charge avec Apache Bench
echo "Running load test..." >> $LOG_FILE
ab -n 1000 -c 10 "https://$DOMAIN/" >> $LOG_FILE

# Test de base de données
echo "Testing database performance..." >> $LOG_FILE
php bin/console app:performance:test-db >> $LOG_FILE

echo "=== End Performance Test ===" >> $LOG_FILE
```

Cette stratégie de tests de performance assure que l'application maintient des performances optimales sous différentes conditions de charge et d'utilisation.
