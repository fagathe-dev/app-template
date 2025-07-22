<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Faker\Factory;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{

    use DateTimeTrait;

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly Security $security,
    ) {
        // Constructor logic if needed
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');
        // Generate a list of roles
        $roles = RoleEnum::list();

        for ($i = 0; $i < random_int(20, 50); $i++) {
            // Create a new user with random data
            $user = new User();
            $role = $faker->randomElement($roles);
            $user->setEmail($faker->email())
                ->setUsername($faker->userName)
                ->setFirstname($faker->firstName)
                ->setLastname($faker->lastName)
                ->setPassword($this->passwordHasher->hashPassword($user, 'password'))
                ->setRoles([$role])
                ->setActive(true)
                ->setRegisteredAt($this->setDateTimeBetween(startDate: '-1 year', timezone: 'Europe/Paris'))
                ->setIdentifier($user->getEmail());

            $manager->persist($user);
        }

        $manager->flush();
    }
}
