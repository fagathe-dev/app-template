<?php

namespace Fagathe\Libs\Security\Symfony\Authenticator;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractLoginFormAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\CsrfTokenBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\SecurityRequestAttributes;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

class FormLoginAuthenticator extends AbstractLoginFormAuthenticator
{
    use TargetPathTrait;

    public const FORM_LOGIN_ROUTE = 'app_login';
    public const DEFAULT_TARGET_PATH = 'app_login';

    public function __construct(private UrlGeneratorInterface $urlGenerator, private UserRepository $userRepository) {}

    /**
     * @param Request $request
     * 
     * @return bool
     */
    public function supports(Request $request): bool
    {
        return $request->isMethod('POST') && $this->getLoginUrl() === $request->getPathInfo();
    }

    public function authenticate(Request $request): Passport
    {
        $username = $request->getPayload()->getString('username');
        $password = $request->getPayload()->getString('password');

        $request->getSession()->set(SecurityRequestAttributes::LAST_USERNAME, $username);
        $badges = [new CsrfTokenBadge('authenticate', $request->getPayload()->getString('_csrf_token')),];

        if ($request->getPayload()->getString('remember_me') === 'on') {
            $badges = [...$badges, new RememberMeBadge()];
        }

        return new Passport(
            new UserBadge($username, fn(string $userIdentifier) => $this->userRepository->findByUsernameOrEmail($userIdentifier)),
            new PasswordCredentials($password),
            $badges,
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        if ($targetPath = $this->getTargetPath($request->getSession(), $firewallName)) {
            return new RedirectResponse($targetPath);
        }

        // For example:
        return new RedirectResponse($this->urlGenerator->generate(static::DEFAULT_TARGET_PATH));
        // throw new \Exception('TODO: provide a valid redirect inside ' . __FILE__);
    }

    protected function getLoginUrl(?Request $request = null): string
    {
        return $this->urlGenerator->generate(static::FORM_LOGIN_ROUTE);
    }
}