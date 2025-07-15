<?php

namespace App\Command;

use Admin\Service\LogService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:log-file-rotation',
    description: 'Rotation of log files ',
)]
class LogFilesRotationCommand extends Command
{
    public function __construct(private readonly LogService $logService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Start rotation script');

        $this->logService->deleteOldFiles();

        $io->success('End of command 🚀');

        return Command::SUCCESS;
    }
}
