<?php

namespace App\Admin\Match;
use Sonata\AdminBundle\Admin\AbstractAdmin;
use Sonata\AdminBundle\Datagrid\ListMapper;
use Sonata\AdminBundle\Datagrid\DatagridMapper;
use Sonata\AdminBundle\Form\FormMapper;
use Symfony\Component\Form\Extension\Core\Type\TextType;

class MatchAdmin extends AbstractAdmin {

    protected function configureFormFields(FormMapper $formMapper) {
        $match = $this->getSubject();

        $formMapper
            ->with('General', ['class' => 'col-md-6'])
                ->add('id', null, ['disabled' => true])
                ->add('name')
                ->add('visible', null, ['help' => 'Allow users to see this match. Keep it invisible until it\'s ready for action'])
            ->end()
            ->with('Gameplay', ['class' => 'col-md-6'])
                ->add('map')
                ->add('speed', null, [
                    'data' => $match->getSpeed() ?: 100,
                    'help' => 'Percent speed distribution of tide and supply. Set lower for longer matches.'
                ])
            ->end()
            ->with('Timeline', ['class' => 'col-md-12'])
                ->add('date_registration', null, [
                    'label' => 'Registration',
                    'help' => 'When users can claim their capital and form alliances'
                ])
                ->add('date_npc', null, [
                    'label' => 'NPC',
                    'help' => 'When users can start attacking non-player territories, and new users can no longer join'
                ])
                ->add('date_p2p', null, [
                    'label' => 'P2P',
                    'help' => 'When users can start attacking other players.
                '])
            ->end()
        ;
    }

    protected function configureDatagridFilters(DatagridMapper $datagridMapper) {
        $datagridMapper->add('name');
    }

    protected function configureListFields(ListMapper $listMapper) {
        $listMapper->addIdentifier('name');
    }
}
