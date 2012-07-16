package org.trebor.extremescheme;

import java.util.Properties;

import org.trebor.extremescheme.api.Thing;
import org.trebor.extremescheme.api.Type;
import org.trebor.extremescheme.impl.BasicThing;

public class ThingFactory
{
  private static final String UNDEFINED_PROPERTY = "[undefined]";
  private static final String NAME_PROPERTY = "name";

  Thing createThing(String name, Type type)
  {
    Properties properties = new Properties();
    
    for (String propertyName: type.getPropertyNames())
      properties.setProperty(propertyName, UNDEFINED_PROPERTY);
    
    properties.setProperty(NAME_PROPERTY, name);
    
    return new BasicThing(type, properties);
  }
}
