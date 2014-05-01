<?php

namespace PG\ElectionViewerBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction($name)
    {
        return $this->render('ElectionViewerBundle:Default:index.html.twig', array('name' => $name));
    }
}
