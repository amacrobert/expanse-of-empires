<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiControllerTest extends WebTestCase
{
    private $client;

    public function setUp() {
        $this->client = static::createClient();
    }

    public function testGetMatches()
    {
        $path = '/api/matches';
        $this->client->request('GET', $path);

        $response = $this->client->getResponse();
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode($response->getContent());
        $this->assertNotEmpty($body);

        $this->assertIsArray($body);
        $this->assertGreaterThan(0, count($body));

        foreach ($body as $match) {
            $this->assertIsObject($match);

            $this->assertObjectHasAttribute('completed', $match);
            $this->assertIsBool($match->completed);

            $this->assertObjectHasAttribute('date_completed', $match);
            $this->assertTrue(
                is_string($match->date_completed) || is_null($match->date_completed)
            );

            $this->assertObjectHasAttribute('date_npc', $match);
            $this->assertIsString($match->date_npc);

            $this->assertObjectHasAttribute('date_p2p', $match);
            $this->assertIsString($match->date_p2p);

            $this->assertObjectHasAttribute('date_registration', $match);
            $this->assertIsString($match->date_registration);

            $this->assertObjectHasAttribute('empire_count', $match);
            $this->assertIsInt($match->empire_count);

            $this->assertObjectHasAttribute('full', $match);
            $this->assertIsBool($match->full);

            $this->assertObjectHasAttribute('id', $match);
            $this->assertIsInt($match->id);

            $this->assertObjectHasAttribute('map_name', $match);
            $this->assertIsString($match->map_name);

            $this->assertObjectHasAttribute('name', $match);
            $this->assertIsString($match->name);

            $this->assertObjectHasAttribute('phase', $match);
            $this->assertIsString($match->phase);

            $this->assertObjectHasAttribute('slots', $match);
            $this->assertIsInt($match->slots);

            $this->assertObjectHasAttribute('speed', $match);
            $this->assertIsInt($match->speed);

            $this->assertObjectHasAttribute('user_joined', $match);
            $this->assertIsBool($match->user_joined);
        }
    }

    /**
     * @dataProvider provideMatchIds
     */
    public function testGetMatchDetails($match_id)
    {
        $path = '/api/match/' . $match_id;
        $this->client->request('GET', $path);

        $response = $this->client->getResponse();
        $this->assertEquals(
            200, $response->getStatusCode(),
            'Bad response: GET ' . $path
        );
    }

    public function testGetUserEmpire()
    {
        $path = '/api/match/1/empire';
        $this->client->request('GET', $path);

        $response = $this->client->getResponse();
        $this->assertEquals(
            200, $response->getStatusCode(),
            'Bad response: GET ' . $path
        );
    }

    public function provideMatchIds()
    {
        return [
            [1],
        ];
    }
}
