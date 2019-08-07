<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class DefaultControllerTest extends WebTestCase
{
    private $client;

    public function setUp() {
        $this->client = static::createClient();
    }

    /**
     * @dataProvider providePaths
     */
    public function testAppPages($path)
    {
        $this->client->request('GET', $path);

        $response = $this->client->getResponse();
        $this->assertEquals(
            200, $response->getStatusCode(),
            'Bad response: GET ' . $path
        );
    }

    public function providePaths()
    {
        return [
            ['/'],
            ['/match/1'],
        ];
    }
}
